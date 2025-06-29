import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  Car,
  DollarSign,
  User,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format, addDays, isSameDay, isAfter, isBefore } from "date-fns";
import toast from "react-hot-toast";
import {
  Mechanic,
  Appointment,
  TimeSlot,
  createAppointment,
  getMechanicAvailability,
} from "../lib/supabase_modules/mechanics";
import "react-calendar/dist/Calendar.css";

interface BookingCalendarProps {
  mechanic: Mechanic;
  onBookingComplete: (appointment: Appointment) => void;
  onClose: () => void;
}

const SERVICE_TYPES = [
  {
    id: "diagnostic",
    name: "Diagnostic",
    description: "Problem diagnosis and assessment",
    duration: 60,
    icon: <Car className="w-5 h-5" />,
  },
  {
    id: "consultation",
    name: "Consultation",
    description: "Expert advice and recommendations",
    duration: 30,
    icon: <User className="w-5 h-5" />,
  },
  {
    id: "repair",
    name: "Repair Service",
    description: "Hands-on repair work",
    duration: 120,
    icon: <Clock className="w-5 h-5" />,
  },
  {
    id: "inspection",
    name: "Inspection",
    description: "Vehicle safety and condition check",
    duration: 45,
    icon: <CheckCircle className="w-5 h-5" />,
  },
] as const;

const LOCATION_TYPES = [
  {
    id: "mobile",
    name: "Mobile Service",
    description: "Mechanic comes to you",
  },
  {
    id: "shop",
    name: "Shop Service",
    description: "Service at mechanic's location",
  },
  {
    id: "remote",
    name: "Remote/Video",
    description: "Video consultation only",
  },
] as const;

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  mechanic,
  onBookingComplete,
  onClose,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [selectedServiceType, setSelectedServiceType] = useState<
    (typeof SERVICE_TYPES)[number] | null
  >(null);
  const [selectedLocationType, setSelectedLocationType] = useState<
    (typeof LOCATION_TYPES)[number] | null
  >(null);
  const [serviceLocation, setServiceLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState<
    "date" | "time" | "service" | "location" | "confirm"
  >("date");

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;

    try {
      setLoadingSlots(true);
      const slots = await getMechanicAvailability(
        mechanic.id,
        selectedDate.toISOString()
      );
      setAvailableSlots(slots.filter((slot) => slot.available));
    } catch (error) {
      console.error("Failed to load available slots:", error);
      toast.error("Failed to load available time slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const calculateTotalCost = () => {
    if (!selectedServiceType || !mechanic.hourly_rate) return 0;
    const hours = selectedServiceType.duration / 60;
    return hours * mechanic.hourly_rate;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setStep("time");
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setStep("service");
  };

  const handleServiceTypeSelect = (
    serviceType: (typeof SERVICE_TYPES)[number]
  ) => {
    setSelectedServiceType(serviceType);
    setStep("location");
  };

  const handleLocationTypeSelect = (
    locationType: (typeof LOCATION_TYPES)[number]
  ) => {
    setSelectedLocationType(locationType);
    setStep("confirm");
  };

  const handleBookingSubmit = async () => {
    if (
      !selectedDate ||
      !selectedTimeSlot ||
      !selectedServiceType ||
      !selectedLocationType
    ) {
      toast.error("Please complete all booking details");
      return;
    }

    try {
      setLoading(true);

      const appointmentData: Partial<Appointment> = {
        mechanic_id: mechanic.id,
        scheduled_date: selectedDate.toISOString().split("T")[0],
        start_time: selectedTimeSlot.start,
        end_time: selectedTimeSlot.end,
        service_type: selectedServiceType.id as Appointment["service_type"],
        estimated_duration: selectedServiceType.duration,
        hourly_rate: mechanic.hourly_rate || 0,
        total_cost: calculateTotalCost(),
        location_type: selectedLocationType.id as Appointment["location_type"],
        service_location: serviceLocation || undefined,
        notes: notes || undefined,
        status: "pending",
      };

      const appointment = await createAppointment(appointmentData);
      toast.success("Appointment booked successfully!");
      onBookingComplete(appointment);
    } catch (error) {
      console.error("Failed to book appointment:", error);
      toast.error("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today) || isAfter(date, addDays(today, 30)); // Allow booking up to 30 days ahead
  };

  const renderStepContent = () => {
    switch (step) {
      case "date":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Date
            </h3>
            <div className="flex justify-center">
              <Calendar
                onChange={handleDateSelect}
                value={selectedDate}
                tileDisabled={({ date }) => isDateDisabled(date)}
                className="react-calendar"
                minDate={new Date()}
                maxDate={addDays(new Date(), 30)}
              />
            </div>
          </div>
        );

      case "time":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Available Times for{" "}
                {selectedDate && format(selectedDate, "MMMM d, yyyy")}
              </h3>
              <button
                onClick={() => setStep("date")}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Change Date
              </button>
            </div>

            {loadingSlots ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleTimeSlotSelect(slot)}
                    className="p-3 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {slot.start} - {slot.end}
                    </div>
                  </button>
                ))}
                {availableSlots.length === 0 && (
                  <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                    <p>No available time slots for this date</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "service":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Service
              </h3>
              <button
                onClick={() => setStep("time")}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Change Time
              </button>
            </div>

            <div className="space-y-3">
              {SERVICE_TYPES.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceTypeSelect(service)}
                  className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">{service.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {service.name}
                        </h4>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {service.duration} min
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Rate: ${mechanic.hourly_rate}/hour
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          $
                          {(
                            (service.duration / 60) *
                            (mechanic.hourly_rate || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case "location":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Service Location
              </h3>
              <button
                onClick={() => setStep("service")}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Change Service
              </button>
            </div>

            <div className="space-y-3">
              {LOCATION_TYPES.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleLocationTypeSelect(location)}
                  className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {location.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {location.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedLocationType?.id === "mobile" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service Address
                </label>
                <input
                  type="text"
                  value={serviceLocation}
                  onChange={(e) => setServiceLocation(e.target.value)}
                  placeholder="Enter the address where service is needed"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            )}
          </div>
        );

      case "confirm":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Booking
              </h3>
              <button
                onClick={() => setStep("location")}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Edit Details
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {mechanic.full_name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {mechanic.location}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedTimeSlot?.start} - {selectedTimeSlot?.end}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedServiceType?.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedServiceType?.duration} minutes
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedLocationType?.name}
                  </div>
                  {serviceLocation && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {serviceLocation}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Total Cost
                  </span>
                </div>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  ${calculateTotalCost().toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any specific details about your vehicle or the issue..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBookingSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Book Appointment"
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6">{renderStepContent()}</div>
    </motion.div>
  );
};

export default BookingCalendar;
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  Car,
  DollarSign,
  User,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format, addDays, isSameDay, isAfter, isBefore } from "date-fns";
import toast from "react-hot-toast";
import {
  Mechanic,
  Appointment,
  TimeSlot,
  createAppointment,
  getMechanicAvailability,
} from "../lib/supabase_modules/mechanics";
import "react-calendar/dist/Calendar.css";

interface BookingCalendarProps {
  mechanic: Mechanic;
  onBookingComplete: (appointment: Appointment) => void;
  onClose: () => void;
}

const SERVICE_TYPES = [
  {
    id: "diagnostic",
    name: "Diagnostic",
    description: "Problem diagnosis and assessment",
    duration: 60,
    icon: <Car className="w-5 h-5" />,
  },
  {
    id: "consultation",
    name: "Consultation",
    description: "Expert advice and recommendations",
    duration: 30,
    icon: <User className="w-5 h-5" />,
  },
  {
    id: "repair",
    name: "Repair Service",
    description: "Hands-on repair work",
    duration: 120,
    icon: <Clock className="w-5 h-5" />,
  },
  {
    id: "inspection",
    name: "Inspection",
    description: "Vehicle safety and condition check",
    duration: 45,
    icon: <CheckCircle className="w-5 h-5" />,
  },
] as const;

const LOCATION_TYPES = [
  {
    id: "mobile",
    name: "Mobile Service",
    description: "Mechanic comes to you",
  },
  {
    id: "shop",
    name: "Shop Service",
    description: "Service at mechanic's location",
  },
  {
    id: "remote",
    name: "Remote/Video",
    description: "Video consultation only",
  },
] as const;

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  mechanic,
  onBookingComplete,
  onClose,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [selectedServiceType, setSelectedServiceType] = useState<
    (typeof SERVICE_TYPES)[number] | null
  >(null);
  const [selectedLocationType, setSelectedLocationType] = useState<
    (typeof LOCATION_TYPES)[number] | null
  >(null);
  const [serviceLocation, setServiceLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState<
    "date" | "time" | "service" | "location" | "confirm"
  >("date");

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;

    try {
      setLoadingSlots(true);
      const slots = await getMechanicAvailability(
        mechanic.id,
        selectedDate.toISOString()
      );
      setAvailableSlots(slots.filter((slot) => slot.available));
    } catch (error) {
      console.error("Failed to load available slots:", error);
      toast.error("Failed to load available time slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const calculateTotalCost = () => {
    if (!selectedServiceType || !mechanic.hourly_rate) return 0;
    const hours = selectedServiceType.duration / 60;
    return hours * mechanic.hourly_rate;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setStep("time");
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setStep("service");
  };

  const handleServiceTypeSelect = (
    serviceType: (typeof SERVICE_TYPES)[number]
  ) => {
    setSelectedServiceType(serviceType);
    setStep("location");
  };

  const handleLocationTypeSelect = (
    locationType: (typeof LOCATION_TYPES)[number]
  ) => {
    setSelectedLocationType(locationType);
    setStep("confirm");
  };

  const handleBookingSubmit = async () => {
    if (
      !selectedDate ||
      !selectedTimeSlot ||
      !selectedServiceType ||
      !selectedLocationType
    ) {
      toast.error("Please complete all booking details");
      return;
    }

    try {
      setLoading(true);

      const appointmentData: Partial<Appointment> = {
        mechanic_id: mechanic.id,
        scheduled_date: selectedDate.toISOString().split("T")[0],
        start_time: selectedTimeSlot.start,
        end_time: selectedTimeSlot.end,
        service_type: selectedServiceType.id as Appointment["service_type"],
        estimated_duration: selectedServiceType.duration,
        hourly_rate: mechanic.hourly_rate || 0,
        total_cost: calculateTotalCost(),
        location_type: selectedLocationType.id as Appointment["location_type"],
        service_location: serviceLocation || undefined,
        notes: notes || undefined,
        status: "pending",
      };

      const appointment = await createAppointment(appointmentData);
      toast.success("Appointment booked successfully!");
      onBookingComplete(appointment);
    } catch (error) {
      console.error("Failed to book appointment:", error);
      toast.error("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today) || isAfter(date, addDays(today, 30)); // Allow booking up to 30 days ahead
  };

  const renderStepContent = () => {
    switch (step) {
      case "date":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Date
            </h3>
            <div className="flex justify-center">
              <Calendar
                onChange={handleDateSelect}
                value={selectedDate}
                tileDisabled={({ date }) => isDateDisabled(date)}
                className="react-calendar"
                minDate={new Date()}
                maxDate={addDays(new Date(), 30)}
              />
            </div>
          </div>
        );

      case "time":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Available Times for{" "}
                {selectedDate && format(selectedDate, "MMMM d, yyyy")}
              </h3>
              <button
                onClick={() => setStep("date")}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Change Date
              </button>
            </div>

            {loadingSlots ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleTimeSlotSelect(slot)}
                    className="p-3 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {slot.start} - {slot.end}
                    </div>
                  </button>
                ))}
                {availableSlots.length === 0 && (
                  <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                    <p>No available time slots for this date</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "service":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Service
              </h3>
              <button
                onClick={() => setStep("time")}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Change Time
              </button>
            </div>

            <div className="space-y-3">
              {SERVICE_TYPES.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceTypeSelect(service)}
                  className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">{service.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {service.name}
                        </h4>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {service.duration} min
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Rate: ${mechanic.hourly_rate}/hour
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          $
                          {(
                            (service.duration / 60) *
                            (mechanic.hourly_rate || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case "location":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Service Location
              </h3>
              <button
                onClick={() => setStep("service")}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Change Service
              </button>
            </div>

            <div className="space-y-3">
              {LOCATION_TYPES.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleLocationTypeSelect(location)}
                  className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {location.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {location.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedLocationType?.id === "mobile" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service Address
                </label>
                <input
                  type="text"
                  value={serviceLocation}
                  onChange={(e) => setServiceLocation(e.target.value)}
                  placeholder="Enter the address where service is needed"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            )}
          </div>
        );

      case "confirm":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Booking
              </h3>
              <button
                onClick={() => setStep("location")}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Edit Details
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {mechanic.full_name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {mechanic.location}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedTimeSlot?.start} - {selectedTimeSlot?.end}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedServiceType?.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedServiceType?.duration} minutes
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedLocationType?.name}
                  </div>
                  {serviceLocation && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {serviceLocation}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Total Cost
                  </span>
                </div>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  ${calculateTotalCost().toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any specific details about your vehicle or the issue..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBookingSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Book Appointment"
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6">{renderStepContent()}</div>
    </motion.div>
  );
};

export default BookingCalendar;
